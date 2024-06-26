import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy } from '@fortawesome/free-regular-svg-icons';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin, ThumbnailIcon} from '@react-pdf-viewer/default-layout';

import { Icon } from '@react-pdf-viewer/core';

import axios from 'axios';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

import "./css/kmolocr-bc2ca5.webflow.css";
import "./css/normalize.css";
import "./css/webflow.css";
import "./css/Home.css"
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

// screen image capture
import { ScreenCapture } from 'react-screen-capture';

// small modal for selecting capture vs upload image mode
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { useRef } from "react";

const Home = () => {

    axios.defaults.timeout = 5000000;

    const [pagesurl, setPagesurl] = useState([]);

    const defaultLayoutPluginInstance = defaultLayoutPlugin({
        sidebarTabs: (defaultTabs) => [
            {
                content: <Thumbnails/>,
                icon: <ThumbnailIcon />,
                title: 'Thumbnails',
            },
            {
                content: <Thumbnails renderThumbnailItem={renderThumbnailItem} />,
                icon: (
                <Icon size={16}>
                    <path d="M23.5,17a1,1,0,0,1-1,1h-11l-4,4V18h-6a1,1,0,0,1-1-1V3a1,1,0,0,1,1-1h21a1,1,0,0,1,1,1Z" />
                    <path d="M5.5 12L18.5 12" />
                    <path d="M5.5 7L18.5 7" />
                </Icon>
                ),
                title: 'Chemicals',
            },
        ].concat(defaultTabs.slice(1)),
    });
    const thumbnailPluginInstance = defaultLayoutPluginInstance.thumbnailPluginInstance;
    const Thumbnails = thumbnailPluginInstance.Thumbnails;

    const handleDocumentLoad = (e) => {
        setPdfSelectedPages(pdfSelectedPages);
    };
    
    const renderThumbnailItem = (props) => {
        const pageIndex = props.pageIndex;
    
        const moleculeEntries = moleculePages.filter(item => item.page === pageIndex);
    
        return moleculeEntries.map((moleculePage, index) => (
            <div
                key={`${moleculePage.page}-${moleculePage.id}`}  // Use a combination of page and unique identifier
                className="custom-thumbnail-item"
                data-testid={`thumbnail-${moleculePage.page}-${moleculePage.id}`}
                style={{
                    backgroundColor: props.pageIndex === props.currentPage ? 'rgba(0, 0, 0, 0.3)' : '#fff',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    width: '100%',
                }}
            >
                <div style={{ marginBottom: '0.5rem' }} onClick={props.onJumpToPage}>
                    <img src={moleculePage.url} alt={`Thumbnail ${moleculePage.page}-${moleculePage.id}`} />
                </div>
                <div
                    style={{
                        alignItems: 'center',
                        display: 'flex',
                        justifyContent: 'center',
                        margin: '0 auto',
                        width: '100px',
                    }}
                >
                    <div style={{
                        alignItems: 'center',
                        display: 'flex',
                        justifyContent: 'center',
                        margin: '0 auto',
                    }}> {props.renderPageLabel}</div>
                </div>
            </div>
        ));
    };
    
    
    

    // state variables
    const [pdfFile, setPdfFile] = useState(null);
    const [pdfFilePath, setPdfFilePath] = useState('');
    const [pdfSelectedFile, setPdfSelectedFile] = useState(null);
    const [pdfFileName, setPdfFileName] = useState('');
    const [pdfSelectedPages, setPdfSelectedPages] = useState([]);
    
    const [imageFile, setImageFile] = useState(null);
    const [imageFilePath, setImageFilePath] = useState('');
    const [predictedImageFilePath, setPredictedImageFilePath] = useState('');
    const [smiles, setSmiles] = useState('');
    const [properties, setProperties] = useState('');
    const [imageSelectedFile, setImageSelectedFile] = useState(null);
    const [imageFileName, setImageFileName] = useState('');
    
    // state for screen capture
    const handleScreenCapture = (screenCapture) => {
        setImageFileName("screen-capture.png");
        setImageSelectedFile(screenCapture);

        let reader = new FileReader();
        
        reader.onloadend = () => {
            setImageFile(reader.result);
        };

        const blob = new Blob([screenCapture], { type: 'image/png' });

        reader.readAsDataURL(blob);
        closeImgModal();
    }

    const [imgModal, setImgModal] = useState(false);
    const closeImgModal = () => setImgModal(false);
    const showImgModal = () => setImgModal(true);

    const hiddenImgFileInput = useRef(null);
    const handleClickImgUpload = ()=>{hiddenImgFileInput.current.click();};

    const handlePdfSelect = (event) => {
        const file = event.target.files[0];
        setPdfSelectedFile(file);
        setPdfFileName(file.name);
        let reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = (e) =>{
            setPdfFile(e.target.result);
        }
    };

    const handlePdfDrop = (event) => {
        event.preventDefault();
        setPdfFile(event.dataTransfer.files[0]);
    };
    
    const handlePdfDragOver = (event) => {
        event.preventDefault();
    };
    const [moleculePages, setMoleculePages] = useState([]);
    const handlePdfUpload = async () => {
        try {
            const formData = new FormData();
            formData.append('pdf', pdfSelectedFile);

            const pdfContentType = 'application/pdf';

            const base64toBlob = (data) => {
                const base64 = data.substr(`data:${pdfContentType};base64,`.length); 
                const byteCharacters = atob(base64);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                return new Blob([byteArray]);
            };
            const blob = base64toBlob(pdfFile);
            const url = URL.createObjectURL(blob);

            const processingResult = await axios.post("http://localhost:5000/api/uploads/pdffileupload", formData)
            .then((response) => {
                if (response.data.result && Array.isArray(response.data.result)) {
                    const molecules = response.data.result.filter(item => item.class === 'molecule');
                    setPdfFilePath(url);
                    setMoleculePages(molecules.map(item => ({
                        page: item.page,
                        url: item.url,
                        id: item['object number']  // Assuming 'object number' is a unique identifier
                    })));
                }}).catch(error => console.log(error))
        } catch (error) {
            console.error('Error uploading file:', error);
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (pdfSelectedFile) {
                    const pdfFileName = pdfSelectedFile.name;
                    const response = await axios.get(`http://localhost:5000/api/uploads/getdetectedchempage/${pdfFileName}`);
                    const { pages, pagesurl } = response.data;  
                    //const detectedChemPage = response.data;
                    setPdfSelectedPages(pages);
                }
            } catch (error) {
                console.error('Error fetching Detection data:', error);
            }
        };
    
        fetchData();
    }, [pdfSelectedFile]);

    {/* 
    const fetchDataByFileName = async (fileName) => {
        try {
            const response = await axios.get(`http://localhost:5000/api/uploads/getdetectedchempage/${fileName}`);
            const detectedChemPage = response.data;
            const uniquePages = [...new Set(detectedChemPage)];
            setPdfSelectedPages(uniquePages);
        } catch (error) {
            console.error('Error fetching Detection data:', error);
        }
    };
    */}
    const handleImageSelect = (event) => {
        const file = event.target.files[0];
        setImageSelectedFile(file);
        setImageFileName(file.name);
        handleImageFile(file);
        closeImgModal();
    };
    
    const handleImageDrop = (event) => {
        event.preventDefault();
        const droppedFile = event.dataTransfer.files[0];
        setImageSelectedFile(droppedFile);
        handleImageFile(droppedFile);
    };
    
    const handleImageDragOver = (event) => {
        event.preventDefault();
    };
    
    const handleImageFile = (file) => {
        let reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = (e) => {
            setImageFile(e.target.result);
        };
    };
    
    const handleImageUpload = async () => {
        try {
            const formData = new FormData();
            formData.append('image', imageSelectedFile);
            const imageContentType = imageSelectedFile.type;

            const base64toBlob = (data) => {
                const base64 = data.substr(`data:${imageContentType};base64,`.length); 
                const byteCharacters = atob(base64);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                return new Blob([byteArray]);
            };
            const blob = base64toBlob(imageFile);
            const url = URL.createObjectURL(blob);

            const request = await axios.post("http://localhost:5000/api/uploads/imagefileupload", formData)
            .then((response) => {
                //console.log(response.data);
                setImageFilePath(response.data.result[0].url);
                setPredictedImageFilePath(response.data.result[0].properties.Predicted_image);
                setSmiles(response.data.result[0].SMILES);
                setProperties(response.data.result[0].properties);
            }).catch(error => console.log(error))
        } catch (error) {
            console.error('Error uploading file:', error);
        }
    }

    const handleCopyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard", { position: "top-right" });
    };

    return(
        <>
        
        <div data-collapse="medium" data-animation="default" data-duration="400" data-easing="ease" data-easing2="ease" role="banner" className="navigation w-nav">
            <div className="navigation-items">
                <Link to="/" className="logo-link w-nav-brand w--current"><h5 className="heading">K-molocr</h5></Link>
                <div className="navigation-wrap">
                    <nav role="navigation" className="navigation-items w-nav-menu">
                        <Link to='/' className="navigation-item w-nav-link w--current">Home</Link>
                        <Link to='/About' className="navigation-item w-nav-link">About</Link>
                        <Link to='/Code' className="navigation-item w-nav-link">Code</Link>
                    </nav>
                    <div className="menu-button w-nav-button"><img src="images/menu-icon_1menu-icon.png" width="22" alt="" className="menu-icon"/></div>
                </div>
            </div>
        </div>
        {!pdfFilePath &&

        <>
        <div className="section">
            <div className="container">
                <div className="intro-wrap">
                    <h1 className="heading-2">
                        K-molocr
                        <br />
                        <br />
                        Supported By Surromind
                    </h1>
                    
                </div>
            </div>
        </div>
        <div className="section">
            <div className="w-row">
                <div className="w-col w-col-6">
                    <div className='upload-section' onDrop={handlePdfDrop} onDragOver={handlePdfDragOver}>
                        <input id="pdfInput" className='file-input' type="file" accept=".pdf" onChange={handlePdfSelect} />
                        <label htmlFor="pdfInput" className="file-label">
                            <FontAwesomeIcon icon={faCopy} size="2x" />
                            <div>{pdfFileName || 'Choose or drag a PDF file'}</div>
                        </label>
                        <button className='process-button' onClick={handlePdfUpload}>Upload PDF</button>
                    </div>
                </div>
                <div className="w-col w-col-6">
                    <div className='upload-section' onDrop={handleImageDrop} onDragOver={handleImageDragOver}>
                        {/* <input id="imageInput" className='file-input' type="file" accept=".jpg, .jpeg, .png" onChange={handleImageSelect} />
                        <label htmlFor="imageInput" className="file-label">
                            <FontAwesomeIcon icon={faCopy} size="2x" />
                            <div>{imageFileName || 'Choose or drag an image file'}</div>
                        </label> */}
                        <label onClick={showImgModal} className = "file-label">
                            <FontAwesomeIcon icon={faCopy} size="2x" />
                            <div>{imageFileName || 'Choose or drag an image file'}</div>
                        </label>
                        <button className='process-button' onClick={handleImageUpload}>Upload Image</button>
                    </div>
                </div>
                <Modal show={imgModal} onHide={closeImgModal}>
                    <Modal.Header closeButton>
                        <Modal.Title>Upload Image File</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>Choose image upload mode</Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleClickImgUpload}>
                            Upload image from directory
                            <input id="imageInput" className='file-input' type="file" accept=".jpg, .jpeg, .png" onChange={handleImageSelect} ref={hiddenImgFileInput} style={{display: "none"}}/>
                        </Button>
                        <ScreenCapture onEndCapture={handleScreenCapture}>
                            {({ onStartCapture }) => (
                                <Button variant = 'primary' onClick={onStartCapture}>Capture screenshot</Button>
                            )}
                        </ScreenCapture>
                    </Modal.Footer>
                </Modal>
                {imageFilePath &&
                        <div className='imagefilepath'>
                            <div className='image-container'>
                                <img src={imageFilePath} alt="Uploaded Preview" />
                                <img src={predictedImageFilePath} alt="Uploaded Preview" />
                            </div>
                            <div className='data-container'>
                                <p>SMILES : {smiles}
                                <button onClick={() => handleCopyToClipboard('CN1C=NC2=C1C(=O)N(C(=O)N2C)C')}>
                                    <FontAwesomeIcon icon={faCopy} />
                                </button>
                                </p>
                                <p>
                                    Properties:
                                        <ul>
                                            {properties && Object.keys(properties).filter(key => key !== 'Predicted_image' && key !== 'add_prefix_rnd_number').map((key) => (
                                                <li key={key}>
                                                    {key}: {properties[key]}
                                                </li>
                                            ))}
                                        </ul>
                                </p>
                            </div>
                        </div>
                    }
            </div>
        </div>
        <div className="footer-wrap">
            <div>
                <a href="https://webflow.com/" target="_blank" className="webflow-link w-inline-block">
                    <div className="paragraph-tiny">K-molocr</div>
                </a>
            </div>
        </div>
        </>
        }
        {pdfFilePath &&
                <div className='pdffilepath'>
                    <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                        <Viewer onDocumentLoad={handleDocumentLoad} fileUrl={pdfFilePath} plugins={[defaultLayoutPluginInstance]}/>;
                    </Worker>
                </div>
        }
        </>
    )
}

export default Home;